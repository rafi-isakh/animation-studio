"use client";

import React from "react";
import Image from "next/image";

import bannerImage from "../../assets/EventBannerOld.png";
import image1 from "../../assets/1.png";
import image2_1 from "../../assets/2-1.png";
import image2_2 from "../../assets/2-2.png";
import image2_3 from "../../assets/2-3.png";
import image3 from "../../assets/3.png";

const images = [
  image1,    // First component image
  image2_1,  // Second component, left
  image2_2,  // Second component, center
  image2_3,  // Second component, right
  image3,    // Third component image
];

const links = [
  "https://www.toonyz.com/view_webnovels/1120", // First image
  "https://www.toonyz.com/view_webnovels/568",  // 2-1
  "https://www.toonyz.com/view_webnovels/524",  // 2-2
  "https://www.toonyz.com/view_webnovels/703",  // 2-3
];

export default function CompetitionPage() {
  return (
    <div style={{ minHeight: "100vh", background: "white", }}>
      {/* Banner Image */}
      <div
        style={{
          width: "80%",
          position: "relative",
          margin: "0 auto",
        }}
      >
        <Image
          src={bannerImage}
          alt="Event Banner"
          style={{ width: "100%", height: "auto", display: "block" }}
          priority
        />
      </div>

      {/* First Component */}
      <section
        style={{
          background: "#e28b98",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 0",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 800 }}>
          <a href={links[0]} target="_blank" rel="noopener noreferrer">
            <Image
              src={images[0]}
              alt="First"
              style={{ objectFit: "contain" }}
              height={images[0].height}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </a>
        </div>
      </section>

      {/* Second Component */}
      <section
        style={{
          background: "#f1cfd6",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", maxWidth: 800 }}>
          {[1, 2, 3].map((idx) => (
            <div key={idx} style={{ margin: 0, padding: 0, lineHeight: 0 }}>
              <a href={links[idx]} target="_blank" rel="noopener noreferrer">
                <Image
                  src={images[idx]}
                  alt={`Second ${idx}`}
                  width={images[idx].width}
                  height={images[idx].height}
                  style={{ display: "block" }}
                />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Third Component */}
      <section
        style={{
          background: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 0",
        }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 1200, height: 400 }}>
          <Image
            src={images[4]}
            alt="Third"
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </div>
      </section>
    </div>
  );
}