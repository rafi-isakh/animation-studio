export const make_video_price = 35; // per video
export const generate_pictures_price = 15; // four pictures
export const generate_trailer_price = 20; // six pictures

interface StarsNameToPrice {
    [key: string]: number;
}

export const stars_name_to_price_krw: StarsNameToPrice = {
    "투니즈 별 150개": 1400,
    "투니즈 별 350개": 3100,
    "투니즈 별 550개": 4600,
    "투니즈 별 1100개": 8800,
    "투니즈 별 100개": 1000,
    "투니즈 별 300개": 3000,
    "투니즈 별 500개": 5000,
    "투니즈 별 1000개": 10000,
}

export const stars_name_to_price_usd: StarsNameToPrice = {
    "투니즈 별 150개": 1,
    "투니즈 별 350개": 2.5,
    "투니즈 별 550개": 3.8,
    "투니즈 별 1100개": 6.2,
    "투니즈 별 100개": 0.75,
    "투니즈 별 300개": 2.25,
    "투니즈 별 500개": 3.75,
    "투니즈 별 1000개": 7.5,
}

export const starsOptions = [100, 300, 500, 1000]
export const starsEventOptions = [150, 350, 550, 1100]
export const discount_factors_event = [0.95, 0.9, 0.85, 0.8]
export const discount_factors = [1, 1, 1, 1]

export function getStarsAndDiscount(selectedPackage: string, isEvent: boolean) {
    let stars = 100; // Default value
    let discount = 1; // Default value

    if (selectedPackage) {
        const packageIndex = parseInt(selectedPackage);
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

    return { stars, discount };
}

export const calculateOrderAmount = (numStars: number, discount: number) => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return stars_name_to_price_usd[`투니즈 별 ${numStars}개`]
};

export const starsString = (numStars: number, language: string) => {
    if (language === 'ko') {
        return `별 ${numStars}개`;
    } else {
        return `${numStars} stars`;
    }
}

export const starsPriceWithCurrencyString = (numStars: number, language: string) => {
    if (language === 'ko') {
        if (numStars === 100) {
            return "1,000원"
        } else if (numStars === 300) {
            return "3,000원"
        } else if (numStars === 500) {
            return "5,000원"
        } else if (numStars === 1000) {
            return "10,000원"
        }

        if (numStars === 150) {
            return "1,400원"
        } else if (numStars === 350) {
            return "3,100원"
        } else if (numStars === 550) {
            return "4,600원"
        } else if (numStars === 1100) {
            return "8,800원"
        }
    }
    else if (language === 'en') {
        if (numStars === 100) {
            return "$0.75"
        } else if (numStars === 300) {
            return "$2.25"
        } else if (numStars === 500) {
            return "$3.75"
        } else if (numStars === 1000) {
            return "$7.50"
        }

        if (numStars === 150) {
            return "$1"
        } else if (numStars === 350) {
            return "$2.50"
        } else if (numStars === 550) {
            return "$3.80"
        } else if (numStars === 1100) {
            return "$6.20"
        }
    }
}