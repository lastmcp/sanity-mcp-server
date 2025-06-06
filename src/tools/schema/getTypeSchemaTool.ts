import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { sanityClient } from "../../config/sanity.js";
import { getSchemaOverview } from "./getSchemaOverviewTool.js";
import { GetSchemaParamsType } from "./schema.js";
import { toJsonString } from "./toJson.js";
import { Schema } from "./generateSchemaOverview.js";

export async function getTypeSchemaTool(
  args: GetSchemaParamsType,
  // extra: RequestHandlerExtra,
) {
  try {
    const allSchemas = await getSchemaOverview({
      typeName: args.type,
      schemaId: args.schemaId,
      lite: false,
    });

    const schema = allSchemas.schemaOverview.typesSummary.type.filter(
      (type) => {
        return type.name === args.type;
      },
    );

    const schemaDetails: Schema = {
      schemaOverview: {
        totalTypes: allSchemas.schemaOverview.totalTypes,
        typesSummary: {
          type: schema,
        },
      },
      schemaDetails: allSchemas.schemaDetails,
    };

    if (!schema) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No schema found for type ${args.type}.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Schema for type ${args.type}:\n${toJsonString(schemaDetails)}`,
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: `Error fetching schema for type ${args.type}: ${error}`,
        },
      ],
    };
  }
}

export async function getSchema(type: string) {
  try {
    const query = `*[_type == $type][0] { ..., _id }`;
    const schemaFields = await sanityClient.fetch(query, { type: type });

    if (!schemaFields) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No schema found for type ${type}.`,
          },
        ],
      };
    }

    const getType = (value: any): string => {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    };

    const formattedFields = Object.entries(schemaFields)
      .map(([field, value]) => `${field}: ${getType(value)}`)
      .join("\n");

    return formattedFields;
  } catch (error) {
    throw new Error(`Error fetching schema for type ${type}: ${error}`);
  }
}
