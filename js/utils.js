
// Format numbers
export const formatNumber = (number) => {
    return new Intl.NumberFormat("en-US").format(number);
};

// Capitalize first letter
export const capitalize = (text = "") => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

// Save data to Local Storage
export const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Get data from Local Storage
export const getFromStorage = (key, fallback = []) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (error) {
        return fallback;
    }
};

// Display toast notification
// Display toast notification using Rest Operator
export const showToast = (message, ...additionalMessages) => {
    const toast = document.createElement("div");
    toast.className = "toast";

    toast.textContent = [message, ...additionalMessages].join(" ");

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
};