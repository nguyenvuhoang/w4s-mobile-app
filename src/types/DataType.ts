export interface TransactionPurpose {
    purposecode: string;
    description: string;
    label: string;
    icon: string;
}

export interface AccountDetail {
    currency: string,
    accountnumber: string,
    accountype: string,
    availablebalance: number,
    customername: string,
    balance: number
}

export interface Branch {
    id: number
    branchid: string
    branchname: string
    address: string
    citycode: string
    distcode: string
    regionid: string
    phone: string
    adpaymentacctlow: any
    adpaymentaccthight: any
    feeacct: any
    isopenfd: string
    positionx: string
    positiony: string
    mobilephone: string
    taxcode: string
    biccode: string
    swiftcode: string
    bcurrencycode: string
    bcynm: string
    lcurrencycode: string
    lcynm: string
    refcode: any
    countryid: string
    language: any
    timeopen: string
    timeclose: string
    thousandnumfmt: any
    decimalnumfmt: any
    datefmt: any
    ldatefmt: any
    timefmt: any
    status: string
    udf: any
    website: any
    email: string
    opendate: any
    usercreate: string
    datecreate: string
    usermodified: string
    lastmodified: string
    userapproved: any
    dateapproved: any
    countryname: any
    totalcount: number
}

export interface TransactionCoreResult {
    CORE_TXNUM: string;
    DR_ACCTNO: string;
    DR_AVLBALANCE: number;
    CR_ACCTNO: string;
    CR_AVLBALANCE: number;
    TRANDESC: string;
    CORE_TXDATE: string;
}

export interface TransactionResponse {
    computed_otp: string;
    transaction_number: string;
    transaction_date: string;
    transacion_status: string;
    transaction_id: string;
    transacion_date: string;
    error_description: string;
    error_name: string;
    error_source: string;
    result: TransactionCoreResult;
    data: boolean;
}

export interface DeviceInformation {
    id: number
    usercode: string
    deviceid: string
    devicetype: string
    status: string
    pushid: string
    osversion: string
    brand: string
    lastseenupdate: string
}

export interface QRPayload {
    accountNumber: string;
    amount?: string;
    bankCode?: string;
    countryCode?: string;
    currencyCode?: string;
    guid?: string;
    merchantCategoryCode?: string;
    merchantCity?: string;
    merchantName?: string;
}

export interface QRContent {
    account_number: string
    amount: string
    merchant_name: any
    merchant_city: any
    bank_code: string
    currency_code: string
    country_code: any
    transaction_type: string
}

export interface VerifyQRResult {
    success: boolean;
    qrcontent?: QRContent;
}

export interface AppType {
  app_code: string;
  app_name: string; // JSON string: { "en": ..., "vi": ..., ... }
  app_type_description: string; // JSON string
  app_type_icon: string;
  order_index: number;
  redirect_page: string;
  is_active: boolean;
  created_on_utc: string;
  updated_on_utc: string | null;
};
