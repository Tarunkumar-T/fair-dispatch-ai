let modelMeta = null;

// Load model information so we can show an explanation aligned with the trained features.
fetch("model_info.json")
  .then((res) => res.json())
  .then((data) => {
    modelMeta = data;
  })
  .catch(() => {
    // Non‑fatal if this fails; we still show a basic score.
    modelMeta = null;
  });

document.getElementById("customerForm").onsubmit = function (e) {
  e.preventDefault();

  const distance = Number(document.getElementById("distance").value);
  const weight = Number(document.getElementById("weight").value);
  const stairs = Number(document.getElementById("stairs").value);
  const buildingType = document.getElementById("buildingType").value;
  const elevator = document.getElementById("elevator").value;
  const parking = document.getElementById("parking").value;
  const traffic = document.getElementById("traffic").value;

  // Simple, transparent base rule to approximate "assumed points"
  let basePoints = 0;
  basePoints += Math.min(distance * 1.2, 15); // distance contribution
  basePoints += Math.min(weight * 0.7, 12); // weight contribution
  basePoints += Math.min(stairs * 0.15, 15); // stairs contribution

  if (elevator === "no") basePoints += 6;
  if (elevator === "broken") basePoints += 3;

  if (parking === "street") basePoints += 4;
  if (parking === "none") basePoints += 7;
  if (parking === "difficult") basePoints += 10;

  if (traffic === "medium") basePoints += 3;
  if (traffic === "high") basePoints += 7;

  // Light ML-inspired weighting using feature importance from model_info.json
  let mlAdjustedPoints = basePoints;
  let explanationLines = [];

  if (modelMeta && modelMeta.feature_importance) {
    const imp = modelMeta.feature_importance;

    // Normalize importance roughly (sum of given importances)
    const importanceSum = Object.values(imp).reduce((a, b) => a + b, 0.0001);

    // Encode categorical values similar to training
    const elevatorEncoded = modelMeta.encoding_mappings.elevator[elevator] ?? 0;
    const parkingEncoded = modelMeta.encoding_mappings.parking[parking] ?? 0;
    const trafficEncoded = modelMeta.encoding_mappings.traffic[traffic] ?? 0;

    const buildingApartment = buildingType === "apartment" ? 1 : 0;
    const buildingCommercial = buildingType === "commercial" ? 1 : 0;
    const buildingHouse = buildingType === "house" ? 1 : 0;

    // Compute a small correction based on important features.
    const featureContrib =
      (stairs * (imp.stairs_count || 0)) +
      (buildingHouse * (imp.building_house || 0)) +
      (trafficEncoded * (imp.traffic_encoded || 0)) +
      (elevatorEncoded * (imp.elevator_encoded || 0)) +
      (parkingEncoded * (imp.parking_encoded || 0)) +
      (weight * (imp.package_weight_kg || 0)) +
      (buildingCommercial * (imp.building_commercial || 0)) +
      (distance * (imp.distance_km || 0)) +
      (buildingApartment * (imp.building_apartment || 0));

    // Scale down to a reasonable correction band (‑10 to +10 approx.)
    const correction = Math.max(
      -10,
      Math.min(10, (featureContrib / importanceSum) * 0.02)
    );

    mlAdjustedPoints = Math.round(basePoints + correction);

    explanationLines.push(
      `Base rule‑based points: ${basePoints.toFixed(1)}`
    );
    explanationLines.push(
      `ML correction (using trained XGBoost feature importances): ${correction.toFixed(
        1
      )} points`
    );
    explanationLines.push(
      `Final AI difficulty points: ${mlAdjustedPoints}`
    );
    explanationLines.push(
      `Top drivers of difficulty in the trained model: stairs, building type (house vs. others), traffic, elevator, and parking conditions.`
    );
  } else {
    mlAdjustedPoints = Math.round(basePoints);
    explanationLines.push(
      `Estimated difficulty points (rule‑based approximation): ${mlAdjustedPoints}`
    );
  }

  // Persist for the driver view
  localStorage.setItem("basePoints", String(mlAdjustedPoints));
  localStorage.setItem(
    "difficultyContext",
    JSON.stringify({
      distance,
      weight,
      stairs,
      buildingType,
      elevator,
      parking,
      traffic,
      basePoints: basePoints,
      finalPoints: mlAdjustedPoints,
    })
  );

  document.getElementById("resultText").innerText = explanationLines.join(
    "\n"
  );
};
