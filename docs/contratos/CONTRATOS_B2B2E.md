# Contratos B2B2E

## POST `/v1/team-metrics`

```json
{
  "schema_version": "1.0",
  "organization_id": "org_demo",
  "team_id": "backend",
  "window_start": "2026-07-22T10:00:00Z",
  "window_minutes": 15,
  "friction_band": "elevated",
  "avg_friction": 0.71,
  "peak_friction": 0.88,
  "interventions": 1,
  "helpful_feedback": 1,
  "active_contributor": true,
  "scenario": "demo"
}
```

No incluir `user_id`.

## GET `/v1/teams/{teamId}/summary`

```json
{
  "team_id": "backend",
  "period_start": "2026-07-22T00:00:00Z",
  "period_end": "2026-07-22T23:59:59Z",
  "contributor_count": 7,
  "privacy_status": "visible",
  "avg_friction": 0.54,
  "trend": "increasing",
  "helpful_rate": 0.76,
  "confidence": "exploratory",
  "recommendations": [
    {
      "code": "REVIEW_MEETING_DENSITY",
      "message": "Revisar la concentración de reuniones durante la tarde."
    }
  ]
}
```

`privacy_status`:

- visible;
- insufficient_group;
- delayed;
- unavailable.

Con grupo insuficiente no devolver métricas.
