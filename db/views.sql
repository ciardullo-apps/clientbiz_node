create or replace view clientview as (
select c.id, c.firstname, c.lastname, c.contactname, c.timezone, c.solicited,
(select count(*) as numappts
from appointment a
where a.client_id = c.id
group by a.client_id) as numappts,
(select sum(rate * (duration / 60) * billingpct) as revenue
from appointment a
where a.client_id = c.id
group by a.client_id) as revenue,
(select date(max(starttime))
from appointment a
where a.client_id = c.id) as lastapptdate,
(select date_format(max(starttime), '%Y-%m')
from appointment a
where a.client_id = c.id) as lastapptyearmonth
from clientele c
order by lastapptyearmonth desc, numappts desc
);
