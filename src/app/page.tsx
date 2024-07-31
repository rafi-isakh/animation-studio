import WebnovelsList from '@/components/WebnovelsList'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';

async function getCarouselItems() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_carousel_items`, {
    cache: 'no-store'
  })
  const data = await response.json()
  return data;
}

async function getWebnovels() {
  const response = fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`, {
    cache: 'no-store'
  })
  const data = (await response).json();
  return data;

}


export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const items = await getCarouselItems();
  const webnovels = await getWebnovels();
  return (
    <div>
      <CarouselComponentReactSlick items={items} />
      <GenresComponent />
      <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
      <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='date' />
    </div>
  );
}
