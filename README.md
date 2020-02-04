A simple time-based client billing app for service professionals built using Node.js, Express.js, and AngularJS

### Data model

![Data Model](https://raw.githubusercontent.com/ciardullo-apps/clientbiz_node/master/db/datamodel.png "Data Model")

### Handling dates between MySQL, node.js and HTML 5

Assumption: MySQL is configured to store datetime column values in UTC but to return datetime column values in local time.

When creating the MySQL connection in node.js, specify timezone='UTC'. This tells the MySQL connection in node.js to convert datetime column values from UTC to local time.

Using JavaScript's Date.prototype.toLocaleString("en-US") returns the time in UTC. In order to return the datetime in local time, you must add the option { timeZone: 'UTC' }.

HTML 5 input field DATETIME format requires that the datetime value _is set_ in the form "YYYY-mm-ddTHH:mi:ss", but the DATETIME input field _is rendered in_ the format MM/DD/YYYY, HH:MI:SS AM.

When setting the INPUT form field to the appropriate DATETIME value, use Date.toJSON().slice(0,16)

When displaying a datetime without an INPUT form control of type DATETIME, use .toLocaleString("en-US", { timeZone: 'UTC' });

