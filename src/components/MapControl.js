import { useState } from "react";
import { useRouter } from "next/router";

export const MapControl = () => {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState(router.query.healthStatus);

  const handleChange = (ev) => {
    setHealthStatus(ev.target.value);
    router.push(`/${ev.target.value}`);
  };

  return (
    <div className="bg-white p-4 m-3 rounded-lg shadow-xl space-y-3 text-sm md:text-base">
      <fieldset className="flex flex-col space-y-1">
        <label htmlFor="health-status" className="font-medium">
          Health Status:
        </label>
        <select
          name="health-status"
          value={healthStatus}
          className="ring-2 ring-teal-600 p-1 rounded rounded-md"
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleChange(e)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="recovered">Recovered</option>
          <option value="asymptomatic">Asymptomatic</option>
          <option value="mild">Mild</option>
          <option value="severe">Severe</option>
          <option value="critical">Critical</option>
          <option value="died">Deaths</option>
        </select>
      </fieldset>
    </div>
  );
};
