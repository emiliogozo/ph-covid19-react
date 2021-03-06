import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import mapboxgl from "mapbox-gl";

import { useRealmApp } from "../contexts/RealmApp";

import { HiAdjustments, HiAnnotation } from "react-icons/hi";

import { MapControl, LoadingMsg, MapLegend, MapStats, Collapsible } from ".";

const REDS = ["#ffffff", "#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];

export const Mapbox = ({ accessToken }) => {
  const app = useRealmApp();
  const router = useRouter();
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState();
  const [legend, setLegend] = useState({});
  const [showLoadingMsg, setShowLoadingMsg] = useState(true);
  const [hoveredFeature, _setHoveredFeature] = useState(null);
  const hoveredFeatureRef = useRef(hoveredFeature);

  mapboxgl.accessToken = accessToken;

  const {
    query: { healthStatus }
  } = router;

  const setHoveredFeature = (data) => {
    hoveredFeatureRef.current = data;
    _setHoveredFeature(data);
  };

  // initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // See style options here: https://docs.mapbox.com/api/maps/#styles
      style: "mapbox://styles/mapbox/streets-v11",
      center: [121.774, 12.8797],
      zoom: 5
    });

    // add navigation control (the +/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.once("load", async () => {
      setMap(map);

      const caseCountLayer = await app.fetchStatsProv(healthStatus);

      map.addSource("ph-covid19", {
        type: "geojson",
        data: caseCountLayer
      });

      map.addLayer({
        id: "ph-covid19",
        type: "fill",
        source: "ph-covid19",
        layout: {},
        paint: {
          "fill-color": "#ffffff",
          "fill-outline-color": "#000000",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1.0,
            0.7
          ]
        }
      });

      map.on("click", "ph-covid19", (e) => {
        const { adm2: province, count } = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div class="flex flex-col space-y-2 m-1">
              <div class="text-base font-semibold border-b border-gray-300">${province}</div>
              <div class="flex flex-row">
                <div class="text-sm font-medium pr-1">Count:</div>
                <div class="text-sm">${new Intl.NumberFormat().format(
                  count
                )}</div>
              </div>
            </div>
            `
          )
          .addTo(map);
      });

      map.on("mousemove", "ph-covid19", (e) => {
        if (e.features.length > 0) {
          if (hoveredFeatureRef.current && hoveredFeatureRef.current > -1) {
            map.setFeatureState(
              { source: "ph-covid19", id: hoveredFeatureRef.current },
              { hover: false }
            );
          }

          let _hoveredFeature = e.features[0].id;

          map.setFeatureState(
            { source: "ph-covid19", id: _hoveredFeature },
            { hover: true }
          );

          setHoveredFeature(_hoveredFeature);
        }
      });

      map.on("mouseenter", "ph-covid19", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "ph-covid19", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredFeatureRef.current) {
          map.setFeatureState(
            { source: "ph-covid19", id: hoveredFeatureRef.current },
            { hover: false }
          );
        }
        setHoveredFeature(null);
      });

      map.on("sourcedataloading", (e) => {
        if (e.sourceId === "ph-covid19") {
          const caseCountArr = e.source.data.features
            .map((o) => o.properties.count)
            .filter((v) => Number.isInteger(v));
          setLayerFillColor(e.target, caseCountArr, REDS);
        }
      });

      map.on("sourcedata", (e) => {
        if (e.sourceId === "ph-covid19") {
          setShowLoadingMsg(false);
        }
      });
    });

    // clean up on unmount
    return () => map.remove();
  }, []);

  useEffect(() => {
    updateLayers(healthStatus);
  }, [healthStatus]);

  const updateLayers = async (healthStatus) => {
    setShowLoadingMsg(true);

    try {
      const lyrSrc = map.getSource("ph-covid19");
      lyrSrc.setData(await app.fetchStatsProv(healthStatus, lyrSrc._data));
    } catch (error) {
      setShowLoadingMsg(false);
      console.log(error);
    }
  };

  const setLayerFillColor = (map, valArr, colArr) => {
    if (valArr.length > 0) {
      const _legendLabelArr = [];
      const _legendColArr = [];
      const lyrFillClr = ["interpolate", ["linear"], ["get", "count"]];

      const sortedArr = valArr.sort((a, b) => a - b);
      const minVal = 0;
      const maxVal = valArr.reduce((a, b) => {
        return a > b ? a : b;
      }, 0);

      if (maxVal === minVal) {
        lyrFillClr.push(minVal);
        lyrFillClr.push(["to-color", colArr[1]]);
      } else {
        let plevVal = "";
        let clevVal = "";
        colArr.forEach((c, idx) => {
          const pos = (sortedArr.length - 1) * (idx / colArr.length);
          const base = Math.floor(pos);
          const rest = pos - base;
          if (sortedArr[base + 1] !== undefined) {
            clevVal =
              sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
          } else {
            clevVal = sortedArr[base];
          }
          if (clevVal > 10 && clevVal < 100) {
            clevVal = Math.ceil(clevVal / 10) * 10;
          } else if (clevVal > 100) {
            clevVal = Math.ceil(clevVal / 100) * 100;
          }
          if (clevVal !== plevVal) {
            _legendLabelArr.push(clevVal);
            _legendColArr.push(c);
            lyrFillClr.push(clevVal);
            lyrFillClr.push(["to-color", c]);
            plevVal = clevVal;
          }
        });
      }

      map.setPaintProperty("ph-covid19", "fill-color", lyrFillClr);

      setLegend({
        label: _legendLabelArr.map((l) => String(l)),
        color: _legendColArr
      });
    }
  };

  return (
    <div className="h-screen w-screen">
      <div className="absolute inset-0" ref={mapContainerRef} />
      <Collapsible
        className="absolute top-0 left-0 flex flex-col justify-between"
        icon={HiAdjustments}
      >
        <MapControl onChange={(healthStatus) => updateLayers(healthStatus)} />
        <MapStats />
      </Collapsible>
      <Collapsible
        className="absolute top-0 right-0 flex flex-col"
        icon={HiAnnotation}
        btnPosition="right"
      >
        <div className="flex flex-col">
          {!showLoadingMsg && (
            <MapLegend title="Number of Cases" legend={legend} />
          )}
        </div>
      </Collapsible>
      {showLoadingMsg && <LoadingMsg />}
    </div>
  );
};
