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

export class BaseRequestModel {
  bo: Array<{
    use_microservice: boolean;
    input: {
      workflowid: string;
      learn_api: string;
      fields: any;
      [key: string]: any;
    };
  }>;

  is_get_template: boolean = false;

  constructor(
    workflowid: string = "",
    learn_api: string,
    inputData: { [key: string]: string } = {},
    is_get_template: boolean = false,
    use_microservice: boolean = true
  ) {
    this.bo = [
      {
        use_microservice: use_microservice,
        input: {
          workflowid: workflowid,
          learn_api: learn_api,
          fields: {
            ...inputData
          }
          ,
        },
      },
    ];
    // }

    this.is_get_template = is_get_template;
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
  fo: Array<{
    txcode: string;
    execute_id: string;
    input: {
      [key: string]: any;
    };
  }>;
  error: any[];
}

export class BaseResponseModel implements BaseResponse {
  fo: {
    txcode: string;
    execute_id: string;
    input: {
      [key: string]: any;
    };
  }[];
  error: any[];

  constructor(
    fo: { txcode: string; execute_id: string; input: { [key: string]: any } }[],
    error: any[]
  ) {
    this.fo = fo;
    this.error = error;
  }

  getFirstFoInput(): { [key: string]: any } | undefined {
    return this.fo.length > 0 ? this.fo[0].input : undefined;
  }

  isSuccess(): boolean {
  return Array.isArray(this.fo) && this.fo.length > 0 && !this.hasErrors();
  }

  hasErrors(): boolean {
    return this.error.length > 0;
  }

  toType<T>(): T | undefined {
    return this.fo[0].input[0] as T;
  }

  getValue<T>(
    key?: string,
    type: "string" | "number" | "boolean" | "auto" = "auto"
  ): T | undefined {
    if (this.fo.length === 0) return undefined;

    const rawInput = this.fo[0].input;
    const value = key ? rawInput[key] : rawInput;

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
    const rawMessage = this.error?.[0]?.info ?? "";
    return rawMessage.replace(/^\[(CTH|DTS|SMS|CBG)_[A-Z_]+\]\s*\[ERROR\]\s*/, "");
  }

  getNextAction(): string {
    return this.error[0]?.next_action || undefined;
  }

  getErrorCode(): string {
    return this.error[0]?.code || undefined;
  }
}

export function hasError(response: BaseResponse): boolean {
  return response.error.length > 0;
}

export function isSuccess(response: BaseResponse): boolean {
  return response.fo.length > 0 && !hasError(response);
}

export function getValue<T>(
  response: BaseResponse,
  key: string
): T | undefined {
  if (response.fo.length === 0) return undefined;
  const value = response.fo[0].input[key];

  if (typeof value === "string" && (value === "true" || value === "false")) {
    return (value === "true") as unknown as T;
  }

  if (typeof value === "string" && !isNaN(Number(value))) {
    return Number(value) as unknown as T;
  }

  return value as T;
}

export const getError = (response: BaseResponse) => {
  return response.error[0].info;
};
