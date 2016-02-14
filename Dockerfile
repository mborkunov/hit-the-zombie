FROM jetty
MAINTAINER Maxim Borkunov <maxim.borkunov@gmail.com>


COPY target/hit-the-zombie-LATEST-SNAPSHOT.war /var/lib/jetty/webapps/root.war

EXPOSE 8080