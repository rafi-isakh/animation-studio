
async function fetchWebnovel(id: string) {
  const res = await fetch(`http://localhost:5000/api/get_webnovel?id=${id}`,
                        {cache: 'no-cache'}
  )

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function NovelView({
  params: { id },
}: {
  params: { id: string }
}) {
    const webnovel = await fetchWebnovel(id);
    return <div>
              <center>
                <p>Title: {webnovel.title}</p>
                <p>Name: {webnovel.user_name}</p>
                <ul>
                  Chapters: {webnovel.chapters?.map((c, key: number) => <li>{key}: {c.title}</li>)}
                </ul>
              </center>
            </div>
}
