import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: '/project-docs/',
  title: 'Project Documentation',
  description: 'Internal developer documentation',
  plugins: [pluginLlms()],
  themeConfig: {
    socialLinks: [],
  },
});
