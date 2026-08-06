#!/bin/sh

# docker pull mcr.microsoft.com/dotnet/samples:aspnetapp

docker run --rm -it -p 5079:80 \
	-p 8001:443 \
	-e ASPNETCORE_URLS="https://+;http://+" \
	-e ASPNETCORE_HTTPS_PORT=8001 \
	-e ASPNETCORE_Kestrel__Certificates__Default__Password="crypticpassword" \
	-e ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx \
	-v ${HOME}/.aspnet/https:/https/ mcr.microsoft.com/dotnet/samples:aspnetapp
