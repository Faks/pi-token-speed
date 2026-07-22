# Troubleshooting

If you encounter issues with the `pi-token-speed` extension, please refer to the following common issues.

## Missing Configuration
If the extension is not loading, ensure that the `~/.pi/agent/settings.json` file exists and contains the `tokenSpeed` block. If not, the extension will revert to defaults automatically.

## Color Rendering Issues
If the colors are not displaying correctly:
- Ensure your terminal supports 24-bit (TrueColor) ANSI escape codes.
- Some older terminals or specific IDE integrated terminals may only support 16 or 256 colors.

## Accuracy of Estimates
If using `countStrategy: estimate`, the token counts are based on character/chunk sizes. This is an approximation and may differ slightly from the exact counts provided by the model's internal tokenizer.

## Contact & Support
For issues not listed here, please check the [GitHub Repository](https://github.com/faks/pi-token-speed) issues page.
