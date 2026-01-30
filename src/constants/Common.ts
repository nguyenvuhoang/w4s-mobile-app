export const MaxTransactionCode = 8;
export const OTPTYPE = {
    VERIFYLOGIN: "VERIFYLOGIN",
    REGISTERSMARTOTP: "REGISTERSMARTOTP",
    RESETPASSWORD: "RESETPASSWORD",
    RESETPASSWORDOTP: "RESETPASSWORDOTP",
    KYCPHONENUMBER:"KYCPHONENUMBER",
    SMSFUNDTRANSFEROTP: "SMSFUNDTRANSFEROTP",
}

export const AUTHENTYPE = {
    SMARTOTP: "SMARTOTP",
    PASSWORD: "PASSWORD",
    FINGERPRINT: "FINGERPRINT",
    FACEID: "FACEID",
    SMSOTP: "SMSOTP"
}
export const AccountType = {
    LOANACCOUNT: "LN",
    DEMANDACCOUNT: "DD",
    SAVINGACCOUNT: "FD",
    WALLETACCOUNT: "WAL",
}

export const BankAccountType = {
    LOAN_BANK_ACCOUNT: "LN",
    DEMAND_BANK_ACCOUNT: "DD",
    SAVING_BANK_ACCOUNT: "FD",
    REVOLVING_BANK_ACCOUNT: "RV",
}

export const ChannelId = {
    Mobile: "MB",
}

export const OTPChannel = {
    SMS: "SMS",
    ZALO: "ZALO",
    MAIL: "MAIL"
}

export const OtpConfig = {
    timeStep: 30
}