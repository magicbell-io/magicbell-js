import { Command, Help } from 'commander';
import kleur from 'kleur';

function sortOptions(a, b) {
  // shorts before longs
  if (a.short && !b.short) return -1;
  if (!a.short && b.short) return 1;
  // move --version to the end
  if (a.long === '--version') return 1;
  if (b.long === '--version') return -1;
  // move ----help to the end
  if (a.long === '--help') return 1;
  if (b.long === '--help') return -1;
  return a.flags > b.flags ? 1 : -1;
}

export function formatHelp(cmd: Command, helper: Help) {
  const termWidth = helper.padWidth(cmd, helper);
  const helpWidth = helper.helpWidth || 80;

  const itemSeparatorWidth = 2; // between term and description
  const indent = ' '.repeat(2);
  const moveOptions = !cmd.parent && cmd.commands.length;

  function formatItem(term, description) {
    if (description) {
      const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
      return helper.wrap(fullText, helpWidth - indent.length, termWidth + itemSeparatorWidth);
    }

    return term;
  }

  function formatList(textArray) {
    const list = textArray.join('\n').replace(/^/gm, indent).trim();
    return list ? indent + list : '';
  }

  const sections = {
    description: '',
    usage: '',
    arguments: '',
    options: '',
    commands: [] as { title: string; list: string }[],
    globalOptions: '',
  };

  sections.description = helper.commandDescription(cmd);
  sections.usage = helper.commandUsage(cmd);
  sections.arguments = formatList(
    helper.visibleArguments(cmd).map((argument) => {
      return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
    }),
  );

  sections.options = formatList(
    helper
      .visibleOptions(cmd)
      .filter((option) => {
        // move --help to global options
        if (cmd.parent && option.long === '--help') {
          cmd.parent.addOption(option);
          return false;
        }

        return true;
      })
      .sort(sortOptions)
      .map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      }),
  );

  // Commands
  const commands: Record<string, Command[]> = {};
  for (const command of helper.visibleCommands(cmd)) {
    const group = ((command as any)._group || 'Commands').trim();
    commands[group] = commands[group] || [];
    commands[group].push(command);
  }

  sections.commands = Object.entries(commands).map(([title, commands]) => ({
    title,
    list: formatList(commands.map((cmd) => formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd)))),
  }));

  sections.globalOptions = this.showGlobalOptions
    ? formatList(
        helper
          .visibleGlobalOptions(cmd)
          .filter((option) => {
            // don't return --version on sub commands
            return option.long !== '--version';
          })
          .sort(sortOptions)
          .map((option) => {
            return formatItem(helper.optionTerm(option), helper.optionDescription(option));
          }),
      )
    : '';

  const output = [];
  output.push(kleur.bold('Usage'), indent + sections.usage, '');

  if (sections.arguments) {
    output.push(kleur.bold('Arguments'), sections.arguments, '');
  }

  if (sections.options && !moveOptions) {
    output.push(kleur.bold('Options'), sections.options, '');
  }

  if (sections.commands.length) {
    sections.commands.forEach((section) => {
      output.push(kleur.bold(section.title), section.list, '');
    });
  }

  if (sections.options && moveOptions) {
    output.push(kleur.bold('Options'), sections.options, '');
  }

  if (sections.globalOptions) {
    output.push(kleur.bold('Global Options'), sections.globalOptions, '');
  }

  return output.join('\n');
}
