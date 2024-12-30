import type {MetadataRoute} from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        "name": "Toonyz",
        "theme_color": "#000000",
        "background_color": "#000000",
        "short_name": "Toonyz",
        "id": "toonyz_app",
        "description": "Toonyz is the Global Story Platform where you can read the world's best novels and webtoons in any language you want.",
        "icons": [{
            "src": "/icons/128.png",
            "sizes": "128x128",
            "type": "image/png"
        },
        {
            "src": "/icons/512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "start_url": "https://toonyz.com",
    "display": "standalone",
    "orientation": "portrait"
    }
}