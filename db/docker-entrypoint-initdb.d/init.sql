CREATE TABLE prediction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    input text COLLATE pg_catalog."default",
    prediction JSON DEFAULT NULL
);