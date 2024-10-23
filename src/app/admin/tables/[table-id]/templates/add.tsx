import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, TextField } from "@mui/material";
import { gql, useMutation } from "@apollo/client";
import DynamicParse from "../../../../../components/DynamicParse";
import useTableData from "../../../../../components/useTableData";

function AddTemplate() {
  const [createTemplate] = useMutation(gql`
    mutation ($input: TemplateInput!) {
      createTemplate(input: $input) {
        id
        title
      }
    }
  `);

  const router = useRouter();
  const tableDbName = router.query["table-id"] as string;
  const [html, setHtml] = useState("<b>{text}</b>");
  const [title, setTitle] = useState("");
  const { data, meta } = useTableData(tableDbName, (_meta) => {
    setHtml(_meta.fields.map((field) => `{${field.dbName}}`).join(" "));
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {meta.fields.map((field, index) => (
          <div key={index}>{`{${field.dbName}}`}</div>
        ))}
      </div>
      <div>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} />
      </div>
      <div>
        {data.map((row, index) => (
          <DynamicParse html={html} replace={row} key={index} />
        ))}
      </div>
      <div>
        <Button
          onClick={async () => {
            await createTemplate({
              variables: {
                input: {
                  tableId: meta.id,
                  title,
                  html,
                },
              },
            });
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export default AddTemplate;
