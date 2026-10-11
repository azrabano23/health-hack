# Engine image. Build from the repo root: docker build --platform linux/amd64 -f infra/aws/Dockerfile .
FROM python:3.11-slim
WORKDIR /srv
COPY engine/requirements.txt engine/requirements.txt
RUN pip install --no-cache-dir -r engine/requirements.txt
COPY engine engine
# only the public seed data the engine reads (paths are ROOT / "data" / ... in the engine)
COPY data/*.json data/
COPY data/synthetic/wellness_aggregate_weekly.json data/synthetic/
WORKDIR /srv/engine
ENV PYTHONPATH=.
EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
