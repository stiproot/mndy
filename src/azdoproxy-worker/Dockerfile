FROM python:3.12-slim AS requirements

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

FROM requirements AS local-requirements

COPY ./pkg/mndy_framework-0.1.0.tar.gz /app/

RUN tar -xvf /app/*.tar.gz -C /app/. && \
  pip install /app/mndy_framework-0.1.0/.

FROM local-requirements AS build

COPY src/ .

FROM build AS final

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "3"]
