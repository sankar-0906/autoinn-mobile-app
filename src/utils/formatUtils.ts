/**
 * Global formatting utility matching the web application's behavior.
 */

export const formatValue = (value: string, type: 'allCaps' | 'firstCaps' | 'onlyNo' | 'noWithDot' | 'code' | 'toUpperCase' | 'toLowerCase', subType = false) => {
    let formatted = value;

    if (type === 'allCaps') {
        // Implementation of Title Case (Capitalize Each Word)
        // Mimics web: value.split(' ').map(v => v.substring(0, 1).toUpperCase() + v.substring(1).toLowerCase()).join(' ')
        formatted = formatted
            .split(' ')
            .map(v => v.charAt(0).toUpperCase() + v.substring(1).toLowerCase())
            .join(' ');

        if (subType) {
            formatted = formatted.replace(/[^0-9a-zA-Z]/g, '');
        }
    }
    else if (type === 'firstCaps') {
        if (formatted.length > 0) {
            formatted = formatted.charAt(0).toUpperCase() + formatted.substring(1);
        }
        if (subType) {
            formatted = formatted.replace(/[^0-9a-zA-Z]/g, '');
        }
    }
    else if (type === 'onlyNo') {
        formatted = formatted.replace(/[^0-9]/g, '');
    }
    else if (type === 'noWithDot') {
        formatted = formatted.replace(/[^0-9.]/g, '');
    }
    else if (type === 'code') {
        formatted = formatted.replace(/[^0-9a-zA-Z]/g, '');
    }
    else if (type === 'toUpperCase') {
        formatted = formatted.toUpperCase();
    }
    else if (type === 'toLowerCase') {
        formatted = formatted.toLowerCase();
    }

    return formatted;
};
