export const make_video_price = 35; // per video
export const generate_pictures_price = 15; // four pictures
export const generate_trailer_price = 20; // six pictures

interface StarsNameToPrice {
    [key: string]: number;
}

export const stars_name_to_price: StarsNameToPrice = {
    "투니즈 별 150개": 1425,
    "투니즈 별 350개": 3150,
    "투니즈 별 550개": 4675,
    "투니즈 별 1100개": 8800,
    "투니즈 별 100개": 1000,
    "투니즈 별 300개": 3000,
    "투니즈 별 500개": 5000,
    "투니즈 별 1000개": 10000,
}
