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
  fo: {
    txcode: string;
    executeId: string;
    input: {
      expiretime: string;
      token: string;
      name: string;
    };
  }[];
  error: any[];
}

export interface SessionValidationResponse {
  fo: {
    txcode: string;
    executeId: string;
    input: {
      isactive: boolean;
    };
  }[];
  error: any[];
}
