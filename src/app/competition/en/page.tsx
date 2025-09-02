"use client";

import React from "react";
import { getImageUrl } from "@/utils/urls";


const images = [
  "en-competition-1.png", // First component
  "en-competition-2-1.png", // Second component left
  "en-competition-2-2.png", // Second component center
  "en-competition-2-3.png", // Second component right
  "en-competition-3.png", // Third component
  "en-competition-FinalResult.png", 
];

const links = [
  "https://www.toonyz.com/view_webnovels/1120", // First image
  "https://www.toonyz.com/view_webnovels/568",  // 2-1
  "https://www.toonyz.com/view_webnovels/524",  // 2-2
  "https://www.toonyz.com/view_webnovels/703",  // 2-3
];

export default function CompetitionPage() {
  return (
    <div style={{ minHeight: "100vh", background: "white" }}>
      {/* Banner Image */}
      <div style={{ width: "80%", margin: "0 auto" }}>
        <img
          src={getImageUrl(images[5])}
          alt="Event Banner"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
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
        <div style={{ width: "100%", maxWidth: 800, display: 'flex', justifyContent: 'center'}}>
          <a href={links[0]} target="_blank" rel="noopener noreferrer">
            <img
              src={getImageUrl(images[0])}
              alt="First"
              style={{
                  maxHeight: "400px",
                  width: "auto",
                  display: "block",
                }}
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
          alignItems: "flex-start",
          padding: "48px 0",
        }}
      >
        <div style={{ display: "flex"}}>
          {[1, 2, 3].map((idx) => (
            <a
              key={idx}
              href={links[idx]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block" }}
            >
              <img
                src={getImageUrl(images[idx])}
                alt={`Second ${idx}`}
                style={{
                  maxHeight: "400px",
                  width: "auto",
                  display: "block",
                }}
              />
            </a>
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
        <div style={{ width: "100%", maxWidth: 1200, height: 400 }}>
          <img
            src={getImageUrl(images[4])}
            alt="Third"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
      </section>
    </div>
  );
}
