export class RequestModel {
  bo: {
    app: string;
    input: any;
  }[];

  constructor(app: string, input: any) {
    this.bo = [
      {
        app: app,
        input: input,
      },
    ];
  }
}

// Class cho request đơn giản
export class SimpleRequestModel {
  workflowid: string;
  fields: any;

  constructor(workflowid: string, fields: { [key: string]: any }) {
    this.workflowid = workflowid;
    this.fields = fields;
  }
}

// Class cho request phức tạp (có bo, use_microservice, etc.)
export class BaseRequestModel {
  is_get_template: boolean = false;

  bo: Array<{
    use_microservice: boolean;
    input: {
      workflowid: string;
      learn_api: string;
      fields: any;
      [key: string]: any;
    };
  }>;

  constructor(
    workflowid: string = "",
    learn_api: string = "cbs_workflow_execute",
    inputData: { [key: string]: any } = {},
    is_get_template: boolean = false,
    use_microservice: boolean = true
  ) {
    this.is_get_template = is_get_template;

    this.bo = [
      {
        use_microservice: use_microservice,
        input: {
          workflowid: workflowid,
          learn_api: learn_api,
          fields: inputData,
        },
      },
    ];
  }
}

export interface ApiResponse {
  data: BaseResponseModel;
  status: number;
  headers: { [key: string]: string };
  config: { [key: string]: any };
  request: { [key: string]: any };
}

export interface BaseResponse {
  code: string;
  success: boolean;
  message: string;
  data: any;
  execution_id: string;
  timestamp: string;
  errors: Array<{
    key: string;
    code: string;
    type: string;
    info: string;
    type_error: string;
    execute_id: string;
    next_action: string;
  }>;
  metadata: any;
}

export class BaseResponseModel implements BaseResponse {
  code: string;
  success: boolean;
  message: string;
  data: any;
  execution_id: string;
  timestamp: string;
  errors: Array<{
    key: string;
    code: string;
    type: string;
    info: string;
    type_error: string;
    execute_id: string;
    next_action: string;
  }>;
  metadata: any;

  constructor(responseData: BaseResponse) {
    this.code = responseData.code;
    this.success = responseData.success;
    this.message = responseData.message;
    this.data = responseData.data;
    this.execution_id = responseData.execution_id;
    this.timestamp = responseData.timestamp;
    this.errors = responseData.errors || [];
    this.metadata = responseData.metadata;
  }

  getData(): any {
    return this.data;
  }

  isSuccess(): boolean {
    return this.success === true && !this.hasErrors();
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  toType<T>(): T | undefined {
    return this.data as T;
  }

  getValue<T>(
    key?: string,
    type: "string" | "number" | "boolean" | "auto" = "auto"
  ): T | undefined {
    if (!this.data) return undefined;

    const value = key ? this.data[key] : this.data;

    if (value === null || value === undefined) return undefined;

    if (type === "string" && typeof value === "string") {
      return value as T;
    }

    if (typeof value === "string") {
      if (
        type === "boolean" ||
        (type === "auto" && (value === "true" || value === "false"))
      ) {
        return (value === "true") as unknown as T;
      }
      if (type === "number" || (type === "auto" && !isNaN(Number(value)))) {
        return Number(value) as unknown as T;
      }
    }

    return value as T;
  }

  getError(): string {
    if (this.errors.length === 0) return this.message || "";
    const rawMessage = this.errors[0]?.info ?? "";
    return rawMessage.replace(/^\[(?:WF_STEP_)?(?:CTH|DTS|SMS|CBG)_[A-Z_]+\]\s*\[ERROR\]\s*/, "");
  }

  getNextAction(): string {
    return this.errors[0]?.next_action || "";
  }

  getErrorCode(): string {
    return this.errors[0]?.code || this.code;
  }

  getExecutionId(): string {
    return this.execution_id;
  }

  getTimestamp(): string {
    return this.timestamp;
  }
}

export function hasError(response: BaseResponse): boolean {
  return response.errors.length > 0 || response.success === false;
}

export function isSuccess(response: BaseResponse): boolean {
  return response.success === true && !hasError(response);
}

export function getValue<T>(
  response: BaseResponse,
  key?: string
): T | undefined {
  if (!response.data) return undefined;

  const value = key ? response.data[key] : response.data;

  if (typeof value === "string" && (value === "true" || value === "false")) {
    return (value === "true") as unknown as T;
  }

  if (typeof value === "string" && !isNaN(Number(value))) {
    return Number(value) as unknown as T;
  }

  return value as T;
}

export const getError = (response: BaseResponse): string => {
  if (response.errors.length === 0) return response.message;
  return response.errors[0].info;
};


export interface ChatStreamOptions {
  url: string;
  token?: string;
  body?: any;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  onMessage: (chunk: string) => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}