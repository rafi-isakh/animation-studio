interface StarsNameToPrice {
    [key: string]: number;
}

export const stars_name_to_price_krw: StarsNameToPrice = {
    "투니즈 별 150개": 1425,
    "투니즈 별 350개": 3150,
    "투니즈 별 550개": 4675,
    "투니즈 별 1100개": 8800,
    "투니즈 별 100개": 1000,
    "투니즈 별 300개": 3000,
    "투니즈 별 500개": 5000,
    "투니즈 별 1000개": 10000,
}

export const starsOptions = [100, 300, 500, 1000]
export const starsEventOptions = [150, 350, 550, 1100]
export const discount_factors_event = [0.95, 0.9, 0.85, 0.8]
export const discount_factors = [1, 1, 1, 1]

export function getStarsAndDiscount(selectedPackage: string, isEvent: boolean) {
    let stars = 100; // Default value
    let discount = 1; // Default value

    if (selectedPackage) {
        console.log('selectedPackage is', selectedPackage, 'isEvent', isEvent)
        const packageIndex = parseInt(selectedPackage);
        console.log('packageIndex is', packageIndex)
        if (!isNaN(packageIndex) && packageIndex >= 0) {
            if (isEvent && packageIndex < starsEventOptions.length) {
                stars = starsEventOptions[packageIndex];
                discount = discount_factors_event[packageIndex];
            } else if (!isEvent && packageIndex < starsOptions.length) {
                stars = starsOptions[packageIndex];
                discount = discount_factors[packageIndex];
            }
        }
    }

    console.log('stars', stars, 'discount', discount)
    return { stars, discount };
}

export const calculateOrderAmount = (numStars: number, discount: number) => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return numStars * 10 * discount;
};