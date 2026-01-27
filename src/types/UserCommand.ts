export interface UserCommand {
    ApplicationCode: string;
    CommandId: string;
    ParentId: string;
    CommandName: string;
    CommandNameLanguage: string;
    CommandType: string;
    CommandURI: string;
    Enabled: boolean;
    DisplayOrder: number;
    GroupMenuIcon: string;
    GroupMenuVisible: string;
    GroupMenuId: string;
}

export interface UserCommandMobile {
    parent_id: string
    command_id: string
    label: string
    command_type: string
    href: any
    role_id: number
    role_name: string
    invoke: string
    approve: string
    icon: any
    group_menu_visible: string
    prefix: any
    group_menu_list_authorize_form: any
    children: any[]
}

export interface AppInfo {
    user_code: string;
    avatar: string | null;
    user_command?: any[] | null;
    name: string;
    login_name: string
    is_first_login: boolean;
    contract_number: string;
    is_biometric_supported: boolean;
    is_smart_otp_active: boolean;
    is_login: boolean;
    user_banner: string;
    currency_code: string;
    refresh_token: string;
}

export interface DepositInfo {
    currency: string;
    accountnumber: string | null;
    accountype: string | null;
    availablebalance: number | null;
    customername: string
    balance: number | null;
    // extend information
    holdbalance? : number | null;
    accountno ?: string | null;
    totalyear?: number | null;
    interestpaid?: number | null;
    fromdate?: string | null;
    todate?: string | null;
    orgdate?: string | null;
    custid?: string | null;
    accruedinterest?: number | null;
    statuscd?: string | null;
    brcd?: string | null;
    interestrate?: number | null;
    brid?: number | null;
    currencyid?: string | null;
    acctname?: string | null;
    dptname?: string | null;
}

export interface WalletInfo {
    walletid: string;
    walletnumber: string;
    walletname: string;
    currencycode: string;
    balance: number;
}

export interface LoanInfo {
    currency: string
    principal_final_due_amt: number
    interest_final_due_date: string
    interest_final_due_amt: number
    accountnumber: string
    principal_next_due_amt: number
    interest: Interest
    balance: number
    principal_final_due_date: string
    interest_next_due_date: string
    principal_remaining_term_count: number
    interest_next_due_amt: number
    principal_next_due_date: string
    customername: string
    interest_remaining_term_count: number
}
export interface Interest {
    type: string
    value: number
}