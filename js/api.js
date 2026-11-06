
const API_URL = "https://countries.dev/countries?fields=name,capital,region,subregion,population,alpha3Code,flags";

export const fetchDestinations = async () => {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch destinations");
        }

        const countries = await response.json();

        return countries.map(country => {
            const {
                name,
                capital,
                region,
                subregion,
                population,
                alpha3Code,
                flags
            } = country;

            return {
                id: alpha3Code,
                name: name || "Unknown",
                capital: capital || "N/A",
                region: region || "Other",
                continent: subregion || region || "Unknown",
                population: population || 0,
                flag: flags?.svg || flags?.png || ""
            };
        });

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
