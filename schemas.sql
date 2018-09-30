create table messages
(
    id serial primary key,
    sender text,
    recipient text,
    time timestamptz,
    message text
);

create table scheduled_messages
(
    id serial primary key,
    sender text,
    recipient text,
    delivery_time timestamptz,
    message text
);