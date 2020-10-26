app:
  googleAnalyticsTrackingId: UA-166771003-5

backend:
  lighthouseHostname: {{ include "lighthouse.serviceName" . | quote }}
  listen:
      port: {{ .Values.appConfig.backend.listen.port | default 7000 }}
  csp:
    script-src:
      - "'self'"
      - "'unsafe-inline'"
  database:
    client: {{ .Values.appConfig.backend.database.client | quote }}
    connection:
      host: {{ include "backend.postgresql.host" . | quote }}
      port: {{ include "backend.postgresql.port" . | quote }}
      user: {{ include "backend.postgresql.user" . | quote }}
      database: {{ .Values.appConfig.backend.database.connection.database | quote }}
      ssl:
        rejectUnauthorized: {{ .Values.appConfig.backend.database.connection.ssl.rejectUnauthorized | quote }}
        ca: {{ include "backstage.backend.postgresCaFilename" . | quote }}

catalog:
{{- if .Values.backend.demoData }}
  locations:
    - type: github
      target: https://github.com/roadiehq/backstage/blob/roadie-on-roadie/packages/catalog-model/examples/roadie.yaml
{{- else }}
  locations: []
{{- end }}

auth:
  providers:
    microsoft: null

scaffolder:
  azure: null


sentry:
  organization: {{ .Values.appConfig.sentry.organization | quote }}

techdocs:
  generators:
    techdocs: 'local'

proxy:
  '/lighthouse': http://{{ include "lighthouse.serviceName" . }}
