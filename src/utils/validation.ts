/**
 * Validates an email address.
 * @param email The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number (Vietnamese format: 10 digits starting with 03, 05, 07, 08, 09).
 * @param phone The phone number to validate.
 * @returns True if the phone number is valid, false otherwise.
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Validates a date string in DD/MM/YYYY format.
 * @param dateString The date string to validate.
 * @returns True if the date is valid, false otherwise.
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const [day, month, year] = dateString.split('/').map(Number);

  // Check validity of the day in the month
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
};

/**
 * Parses a full name into its constituent parts: firstname, middlename, and lastname.
 * @param fullName The full name string to parse.
 * @returns An object containing firstname, middlename, and lastname.
 */
export const parseFullName = (fullName: string): {
  firstname: string;
  middlename: string;
  lastname: string;
} => {
  const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return { firstname: '', middlename: '', lastname: '' };
  } else if (nameParts.length === 1) {
    // Only 1 word -> put in lastname
    return { firstname: '', middlename: '', lastname: nameParts[0] };
  } else if (nameParts.length === 2) {
    // 2 words -> put in firstname and lastname
    return { firstname: nameParts[0], middlename: '', lastname: nameParts[1] };
  } else {
    // 3 or more words -> firstname, middlename (middle words), lastname
    const firstname = nameParts[0];
    const lastname = nameParts[nameParts.length - 1];
    const middlename = nameParts.slice(1, -1).join(' ');
    
    return { firstname, middlename, lastname };
  }
};
