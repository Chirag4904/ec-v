require("dotenv").config();

const express = require("express");
const { mapTopKpis } = require("./mapTopKpis");

const app = express();

app.use(express.json());

const {
  DATABRICKS_HOST,
  DATABRICKS_TOKEN,
  DATABRICKS_SQL_WAREHOUSE_ID,
  PORT,
  CORS_ORIGIN,
  TOP_KPI_VIEW,
  PRIORITY_AREAS_VIEW,
  PAIN_POINTS_AI_VIEW,
  SENTIMENT_AI_VIEW,
  SR_VOLUME_AI_VIEW,
  FORECAST_AI_VIEW,
  AI_HIGHLIGHTS_VIEW,
  RECOMMENDED_ACTIONS_VIEW,
  EARLY_WARNING_FEED_VIEW,
} = process.env;

function assertConfigured() {
  const missing = [];

  if (!DATABRICKS_HOST) {
    missing.push("DATABRICKS_HOST");
  }

  if (!DATABRICKS_TOKEN) {
    missing.push("DATABRICKS_TOKEN");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`,
    );
  }
}

function baseUrl() {
  return DATABRICKS_HOST.replace(/\/+$/, "");
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

async function runStatement(statement) {
  assertConfigured();

  const headers = {
    Authorization: `Bearer ${DATABRICKS_TOKEN}`,
    "Content-Type": "application/json",
  };

  let response = await fetch(`${baseUrl()}/api/2.0/sql/statements`, {
    method: "POST",

    headers,

    body: JSON.stringify({
      warehouse_id: DATABRICKS_SQL_WAREHOUSE_ID,
      statement,
      wait_timeout: "30s",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Databricks API error: ${response.status} ${await response.text()}`,
    );
  }

  let data = await response.json();

  const statementId = data.statement_id;

  while (["PENDING", "RUNNING"].includes(data.status.state)) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    response = await fetch(
      `${baseUrl()}/api/2.0/sql/statements/${statementId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Databricks polling error: ${response.status} ${await response.text()}`,
      );
    }

    data = await response.json();
  }

  if (data.status.state !== "SUCCEEDED") {
    throw new Error(`Query failed: ${JSON.stringify(data.status)}`);
  }

  const columns = data.manifest.schema.columns.map((column) => column.name);

  const rows = data.result?.data_array || [];

  return rows.map((row) =>
    Object.fromEntries(
      columns.map((columnName, index) => [columnName, row[index]]),
    ),
  );
}

// No additional filtering query in the backend.
// The Databricks view itself contains the fixed selection.
async function fetchView(viewName) {
  return runStatement(`SELECT * FROM ${viewName}`);
}

// Highlight IDs look like "forecast_8eafec7dd6c2435ba5fc6dc6" — letters,
// digits, underscores only. Validated before going anywhere near a SQL
// string so this can't be used to inject arbitrary SQL through the URL.
const HIGHLIGHT_ID_PATTERN = /^[a-zA-Z0-9_]+$/;

async function fetchViewByHighlightId(viewName, highlightId) {
  if (!HIGHLIGHT_ID_PATTERN.test(highlightId)) {
    const err = new Error("Invalid highlight id");
    err.statusCode = 400;
    throw err;
  }
  return runStatement(
    `SELECT * FROM ${viewName} WHERE highlight_id = '${highlightId}'`,
  );
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

app.get("/health", (req, res) => {
  try {
    assertConfigured();

    return res.json({
      success: true,
      host: baseUrl(),
      warehouseId: DATABRICKS_SQL_WAREHOUSE_ID,
      topKpiView: TOP_KPI_VIEW,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Simple GET request.
// No query parameters.
// No request body.
app.get("/api/dashboard/top-kpis", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const rows = await fetchView(TOP_KPI_VIEW);

    return res.json({
      success: true,
      data: mapTopKpis(rows), // was `data: rows` — now shaped for the frontend
    });
  } catch (error) {
    console.error("Top KPI request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/priority-areas", async (req, res) => {
  try {
    const rows = await fetchView(PRIORITY_AREAS_VIEW);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Priority Areas request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/pain-points-ai", async (req, res) => {
  try {
    const rows = await fetchView(PAIN_POINTS_AI_VIEW);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: "Pain Points data not found",
      });
    }

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Pain Points AI request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/sentiment-ai", async (req, res) => {
  try {
    const rows = await fetchView(SENTIMENT_AI_VIEW);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: "Sentiment data not found",
      });
    }

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Sentiment AI request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/sr-volume-ai", async (req, res) => {
  try {
    const rows = await fetchView(SR_VOLUME_AI_VIEW);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: "SR Volume data not found",
      });
    }

    const row = rows[0];

    const chartData = rows[0].monthly_history_json || [];

    return res.json({
      success: true,
      data: row,
      chartData,
    });
  } catch (error) {
    console.error("SR Volume AI request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/forecast-ai", async (req, res) => {
  try {
    const rows = await fetchView(FORECAST_AI_VIEW);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: "Forecast data not found",
      });
    }

    const row = rows[0];

    const actualChartData = rows[0].monthly_actual_history_json || [];

    const forecastChartData = rows[0].monthly_forecast_json || [];

    return res.json({
      success: true,
      data: row,

      chartData: {
        actual: actualChartData,
        forecast: forecastChartData,
      },
    });
  } catch (error) {
    console.error("Forecast AI request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/recommended-actions", async (req, res) => {
  try {
    const rows = await fetchView(RECOMMENDED_ACTIONS_VIEW);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Recommended Actions request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/dashboard/early-warning-feed", async (req, res) => {
  try {
    const rows = await fetchView(EARLY_WARNING_FEED_VIEW);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Early Warning Feed request failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generic per-item drill-down detail — same shape regardless of which
// pillar the highlight belongs to (the row's own card_key field says
// which one). This is what each bucket/chip's detailApiPath points at,
// e.g. /api/dashboard/ai-highlights/forecast_8eafec7dd6c2435ba5fc6dc6
app.get("/api/dashboard/ai-highlights/:highlightId", async (req, res) => {
  console.log("AI Highlight detail request for id:", req.params.highlightId);
  console.log("AI Highlight view:", AI_HIGHLIGHTS_VIEW);
  res.setHeader("Cache-Control", "no-store");
  try {
    const rows = await fetchViewByHighlightId(
      AI_HIGHLIGHTS_VIEW,
      req.params.highlightId,
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: `No highlight found for id "${req.params.highlightId}"`,
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("AI Highlight detail request failed:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`DrishtiAI backend listening on http://localhost:${PORT}`);

  console.log("Available routes:");
  console.log("GET /health");
  console.log("GET /api/dashboard/top-kpis");
  console.log("GET /api/dashboard/priority-areas");
  console.log("GET /api/dashboard/pain-points-ai");
  console.log("GET /api/dashboard/sentiment-ai");
  console.log("GET /api/dashboard/sr-volume-ai");
  console.log("GET /api/dashboard/forecast-ai");
  console.log("GET /api/dashboard/recommended-actions");
  console.log("GET /api/dashboard/early-warning-feed");
  console.log("GET /api/dashboard/ai-highlights/:highlightId");
});