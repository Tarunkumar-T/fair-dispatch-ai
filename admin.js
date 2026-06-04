// Load and display metadata about the trained difficulty and traffic models

function formatDifficultyModelInfo(info) {
  const metrics = info.performance_metrics || {};
  const topFeatures = Object.entries(info.feature_importance || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name.replace(/_/g, " "))
    .join(", ");

  return [
    `Model type: ${info.model_type} (v${info.model_version})`,
    `Trained on ${info.training_samples} samples, tested on ${info.test_samples} samples.`,
    `Test RMSE: ${metrics.test_rmse?.toFixed(2)}, Test MAE: ${metrics.test_mae?.toFixed(
      2
    )}, Test R²: ${metrics.test_r2?.toFixed(3)}`,
    `Most influential features: ${topFeatures}.`,
    `The UI customer form is aligned with these features: distance, weight, stairs, building type, elevator, parking, and traffic.`
  ].join("\n");
}

function formatTrafficModelInfo(info) {
  const metrics = info.performance_metrics || {};

  return [
    `Model type: ${info.model_type} (v${info.model_version})`,
    `Forecast horizon: ${info.prediction_range} using ${info.data_period} of historical data.`,
    `Test MAE: ${metrics.test_mae?.toFixed(3)}, RMSE: ${metrics.test_rmse?.toFixed(
      3
    )}, MAPE: ${metrics.test_mape?.toFixed(2)}%.`,
    `Seasonality: weekly=${info.model_parameters.weekly_seasonality}, daily=${info.model_parameters.daily_seasonality}.`,
    `In a full system, this forecast would dynamically set the "traffic" factor used in the difficulty points calculation.`
  ].join("\n");
}

fetch("model_info.json")
  .then((res) => res.json())
  .then((data) => {
    const el = document.getElementById("modelMetaText");
    if (el) el.innerText = formatDifficultyModelInfo(data);
  })
  .catch(() => {
    const el = document.getElementById("modelMetaText");
    if (el) el.innerText = "Unable to load model_info.json (static demo mode).";
  });

fetch("traffic_model_info.json")
  .then((res) => res.json())
  .then((data) => {
    const el = document.getElementById("trafficMetaText");
    if (el) el.innerText = formatTrafficModelInfo(data);
  })
  .catch(() => {
    const el = document.getElementById("trafficMetaText");
    if (el) el.innerText =
      "Unable to load traffic_model_info.json (static demo mode).";
  });
