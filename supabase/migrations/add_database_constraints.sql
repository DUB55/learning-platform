-- Add constraints to ensure data integrity

-- Learning Sets
ALTER TABLE learning_sets
ADD CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100);

-- Learning Set Items
ALTER TABLE learning_set_items
ADD CONSTRAINT term_required CHECK (char_length(term) > 0),
ADD CONSTRAINT definition_required CHECK (char_length(definition) > 0);

-- Subjects
ALTER TABLE subjects
ADD CONSTRAINT subject_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 50);

-- Units
ALTER TABLE units
ADD CONSTRAINT unit_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100);

-- Paragraphs
ALTER TABLE paragraphs
ADD CONSTRAINT paragraph_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100);

-- Documents
ALTER TABLE documents
ADD CONSTRAINT document_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100);

-- Ensure user_id is present for RLS
ALTER TABLE learning_sets
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE subjects
ALTER COLUMN user_id SET NOT NULL;
