"use client"
import { Webnovel } from '@/components/Types';
import WebnovelComponent from '@/components/WebnovelComponent';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Suspense } from 'react'

const Search = () => {
  const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  useEffect(() => {
    fetch(`https://stellandai.com/api/search?query=${query}`)
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

const SearchWrapper = () => {
  return (
    <Suspense>
      <Search/>
    </Suspense>
  )
}

export default SearchWrapper;