import { Language } from "@/components/Types";
import { loadStripe } from "@stripe/stripe-js";

export const make_video_price = 4; // per video
export const generate_pictures_price = 2; // four pictures
export const generate_trailer_price = 3; // six pictures

interface StarsNameToPrice {
    [key: string]: number;
}

interface TicketsNameToPrice {
    [key: string]: number;
}

export const stars_name_to_price_krw: StarsNameToPrice = {
    "투니즈 별 20개": 2000,
    "투니즈 별 50개": 5000,
    "투니즈 별 100개": 10000,
    "투니즈 별 200개": 20000,
    "투니즈 별 300개": 30000,
    "투니즈 별 500개": 50000,
    "투니즈 별 700개": 70000,
    "투니즈 별 1000개": 100000,
}

export const stars_name_to_free_stars_krw: StarsNameToPrice = {
    "투니즈 별 20개": 1,
    "투니즈 별 50개": 2,
    "투니즈 별 100개": 3,
    "투니즈 별 200개": 6,
    "투니즈 별 300개": 12,
    "투니즈 별 500개": 20,
    "투니즈 별 700개": 28,
    "투니즈 별 1000개": 50,
}

export const stars_name_to_price_usd: StarsNameToPrice = {
    "투니즈 별 2개": 0.99,
    "투니즈 별 8개": 3.99,
    "투니즈 별 20개": 9.99,
    "투니즈 별 30개": 13.99,
    "투니즈 별 50개": 23.99,
    "투니즈 별 62개": 29.99,
}

export const tickets_name_to_price_krw: TicketsNameToPrice = {
    "투니즈 티켓 20장": 2000,
    "투니즈 티켓 50장": 5000,
    "투니즈 티켓 100장": 10000,
    "투니즈 티켓 200장": 20000,
    "투니즈 티켓 300장": 30000,
    "투니즈 티켓 500장": 50000,
    "투니즈 티켓 700장": 70000,
    "투니즈 티켓 1000장": 100000,
}

export const tickets_name_to_price_usd: TicketsNameToPrice = {
    "투니즈 티켓 20장": 1.5,
    "투니즈 티켓 50장": 3.5,
    "투니즈 티켓 100장": 7.5,
    "투니즈 티켓 200장": 14.5,
    "투니즈 티켓 300장": 22,
    "투니즈 티켓 500장": 36.5,
    "투니즈 티켓 700장": 51.5,
    "투니즈 티켓 1000장": 73.5,
}


export const starsOptions = [20, 50, 100, 200, 300, 500, 700, 1000]
export const starsOptionsUSD = [2, 8, 20, 30, 50, 62]
export const ticketsOptions = [20, 50, 100, 200, 300, 500, 700, 1000]

export const calculateOrderAmount = (numStars: number, language: string) => {
    if (language === 'ko') {
        return stars_name_to_price_krw[`투니즈 별 ${numStars}개`]
    } else {
        return stars_name_to_price_usd[`투니즈 별 ${numStars}개`] * 100 // in cents
    }
};

export const starsString = (numStars: number, language: string) => {
    if (language === 'ko') {
        return `별 ${numStars}개`;
    } else {
        return `${numStars} stars`;
    }
}

export const ticketsString = (numTickets: number, language: string) => {
    if (language === 'ko') {
        return `티켓 ${numTickets}장`;
    } else {
        return `${numTickets} tickets`;
    }
}

export const starsPriceWithCurrencyString = (numStars: number, language: string) => {
    if (language === 'ko') {
        if (numStars === 20) {
            return "2,000원"
        } else if (numStars === 50) {
            return "5,000원"
        } else if (numStars === 100) {
            return "10,000원"
        } else if (numStars === 200) {
            return "20,000원"
        } else if (numStars === 300) {
            return "30,000원"
        } else if (numStars === 500) {
            return "50,000원"
        } else if (numStars === 700) {
            return "70,000원"
        } else if (numStars === 1000) {
            return "100,000원"
        }
    }
    else if (language === 'en') {
        
        if (numStars === 2) {
            return "$0.99"
        } else if (numStars === 8) {
            return "$3.99"
        } else if (numStars === 20) {
            return "$9.99"
        } else if (numStars === 30) {
            return "$13.99"
        } else if (numStars === 50) {
            return "$23.99"
        } else if (numStars === 62) {
            return "$29.99"
        }
    }
}

export const ticketsPriceWithCurrencyString = (numTickets: number, language: string) => {
    if (language === 'ko') {
        if (numTickets === 20) {
            return "2,000원"
        } else if (numTickets === 50) {
            return "5,000원"
        } else if (numTickets === 100) {
            return "10,000원"
        } else if (numTickets === 200) {
            return "20,000원"
        } else if (numTickets === 300) {
            return "30,000원"
        } else if (numTickets === 500) {
            return "50,000원"
        } else if (numTickets === 700) {
            return "70,000원"
        } else if (numTickets === 1000) {
            return "100,000원"
        }
    }
    else if (language === 'en') {
        if (numTickets === 20) {
            return "$1.5"
        } else if (numTickets === 50) {
            return "$3.5"
        } else if (numTickets === 100) {
            return "$7.5"
        } else if (numTickets === 200) {
            return "$14.5"
        } else if (numTickets === 500) {
            return "$36.5"
        } else if (numTickets === 300) {
            return "$22"
        } else if (numTickets === 500) {
            return "$36.5"
        } else if (numTickets === 700) {
            return "$51.5"
        } else if (numTickets === 1000) {
            return "$73.5"
        }
    }
}

export const getStripe = (language: Language) => {
    const stripeLocale = language === 'ko' ? 'ko' : language === 'ja'? 'ja': 'en'
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        locale: stripeLocale,
    })
}

export const nominalDiscountFactorsUSD = [0, 3, 13, 19, 29, 50]