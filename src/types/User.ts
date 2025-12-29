interface UserSession {
    id: number;
    usercode: string;
    username: string;
    loginname: string;
    token: string;
    workingdate: string;
    branchid: number;
    branchcode: string;
    branchname: string;
    departmentid: number;
    departmentcode: string;
    region: string | null;
    branchstatus: string;
    bankstatus: string;
    resetpassword: boolean;
    expiretime: string;
    refresh_token: string;
}

export type { UserSession };
