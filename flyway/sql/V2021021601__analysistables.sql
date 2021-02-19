CREATE TABLE analysis_request (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dt_created timestamp(0) without time zone NOT NULL,
    dt_updated timestamp(0) without time zone NOT NULL,
    dt_predicted timestamp(0) without time zone,
    input text COLLATE pg_catalog."default",
    original_analysis_request_id uuid
);

CREATE TABLE analysis_paragraph (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_request_id uuid NOT NULL,
    sequence_no SMALLINT NOT NULL,
    heading text
);
ALTER TABLE analysis_paragraph
    ADD CONSTRAINT analysis_paragraph_analysis_request_id_fkey FOREIGN KEY (analysis_request_id)
    REFERENCES analysis_request (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

CREATE TABLE analysis_sentence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_paragraph_id uuid NOT NULL,
    input text COLLATE pg_catalog."default" NOT NULL,
    dt_evaluated timestamp(0) without time zone,
    citation_detected boolean,
    citation_needed_threshold real,
    prediction_score_raw real,
    prediction_score_adj real,
    prediction_adj_method text,
    user_evaluation_category text,
    user_evaluation_text text
);
ALTER TABLE analysis_sentence
    ADD CONSTRAINT analysis_sentence_analysis_request_id_fkey FOREIGN KEY (analysis_paragraph_id)
    REFERENCES analysis_paragraph (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;