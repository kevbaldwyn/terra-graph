import { Command, Flags } from "@oclif/core";
import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const backendConfigFile = `terraform {
  backend "local" {
    path = ".terraform/terra-graph.tfstate"
  }
}
`;

export default class Graph extends Command {

  static override description = 'Initialises terraform specifically for terra-graph and then runs `terraform graph`. This requires no credentials and will not affect any existing backend or state. Typically this should be executed before running `terra-graph create`';

    static override examples = [
    '<%= config.bin %> <%= command.id %> --backendFile=backend.tf',
    '<%= config.bin %> <%= command.id %> --skipCleanup',
  ];

  static override flags = {
    backendFile: Flags.string({
      required: false,
      default: 'terraform.tf',
      char: 'f',
      description: 'Provide the name of the file that contains your `backend {}` configuration (expected .tf extension). An "_override.tf" version will be created, allowing a brand new terra-graph only state file to be generated.',
    }),
    skipCleanup: Flags.boolean({
      required: false,
      default: false,
      char: 's',
      description: 'By default terra-graph will delete the terra-graph.tfstate file after generating the initial terraform graph. This flag will skip this behaviour.'
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Graph);

    // create file
    const tfFile = `${flags.backendFile.replace('.tf', '')}_override.tf`;
    writeFileSync(tfFile, backendConfigFile);

    // run terraform init
    this.executeShell('terraform init');

    // run terraform graph
    const graph = this.executeShell('terraform graph');

    // cleanup
    if(!flags.skipCleanup) {
      rmSync(tfFile);
    }

    // output the resulting graph
    this.log(graph);
  }

  private executeShell(cmd: string) {
    return execSync(cmd).toString();
  }
}
