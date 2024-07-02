"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import { useState, useEffect } from 'react';
const Search = () => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);

  useEffect(() => {
    console.log("haha");
  }, []);

  useEffect(() => {
    const storedData = sessionStorage.getItem('searchData');
    var json;
    if (storedData) {
      json = JSON.parse(storedData);
    }
    if (json) {
      setWebnovels(json);
    } else {
      setWebnovels([]);
      sessionStorage.setItem('searchData', '')
    }
  }, [webnovels]);

  return (
    <div>
      <center>
        {
          (webnovels.length) ?
            webnovels.map((webnovel, index) => (
              <WebnovelComponent key={index} webnovel={webnovel} />
            )) :
            <main>검색결과가 없습니다</main>
        }
      </center>
    </div>
  );
};

export default Search;