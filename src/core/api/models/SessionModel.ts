export class Session {
  token: string;

  constructor(data: any) {
    this.token = data.token;
  }

  static fromJson(data: any): Session | null {
    if (typeof data.token === "string") {
      return new Session(data);
    }
    return null;
  }
}

export interface SessionLoginResponse {
  code: string;
  success: boolean;
  message: string;
  data: {
    expiretime: string;
    token: string;
    name: string;
  };
  execution_id: string;
  timestamp: string;
  errors: any[];
  metadata: any;
}

export interface SessionValidationResponse {
  code: string;
  success: boolean;
  message: string;
  data: {
    isactive: boolean;
  };
  execution_id: string;
  timestamp: string;
  errors: any[];
  metadata: any;
}