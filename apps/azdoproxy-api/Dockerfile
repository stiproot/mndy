FROM mcr.microsoft.com/dotnet/sdk:8.0 AS restore-build-publish
  WORKDIR /src

  COPY ./nscacert.pem /usr/local/share/ca-certificates/nscacert.crt
  RUN update-ca-certificates

  COPY ./src/azdoproxy-api/. .
  RUN dotnet restore .

  RUN dotnet publish . --no-restore --configuration Release --output /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
  RUN mkdir /app
  WORKDIR /app
  COPY --from=restore-build-publish /publish /app

  USER $APP_UID

  EXPOSE 5000
  ENV ASPNETCORE_URLS=http://+:5000
  ENTRYPOINT ["dotnet", "./azdoproxy-api.dll"]
