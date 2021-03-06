import { RealmAppProvider } from "../contexts/RealmApp";
import { Mapbox } from "../components";
import { getCountSummary, getCountCasesProv, getBasemap } from "../util/realm";

function IndexPage({ mapboxAccessToken, data }) {
  return (
    <RealmAppProvider data={data}>
      <Mapbox accessToken={mapboxAccessToken} />
    </RealmAppProvider>
  );
}

export const getStaticProps = async () => {
  try {
    const countSummary = JSON.parse(await getCountSummary());
    const countCasesProv = JSON.parse(await getCountCasesProv("active"));
    const basemap = JSON.parse(await getBasemap());

    return {
      props: {
        mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
        data: { basemap, countSummary, countCasesProv }
      },
      revalidate: 60
    };
  } catch (err) {
    return {
      notFound: true
    };
  }
};

export default IndexPage;
