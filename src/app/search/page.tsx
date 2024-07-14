"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import { useState, useEffect } from 'react';

const Search = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const query = searchParams.query;

  if (typeof query === 'string') {
  } else if (Array.isArray(query)) {
      throw new Error("there should be only one query param")
  } else {
  }

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/search?query=${query}`)
      .then(r => r.json())
      .then(r => setWebnovels(r));
  }, [query]);

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