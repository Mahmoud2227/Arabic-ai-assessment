import json
import os

def generate_markdown(json_path: str = "/app/logs/evaluation_report.json", md_path: str = "/app/logs/evaluation_report.md"):
    if not os.path.exists(json_path):
        print(f"File {json_path} not found.")
        return

    with open(json_path, "r") as f:
        metrics = json.load(f)

    with open(md_path, "w") as f:
        f.write("# Arabic AI Chat - Automated Evaluation Report\n\n")
        f.write("This report is generated automatically by the continuous evaluation service.\n\n")
        
        f.write("## Performance & Success Metrics\n\n")
        f.write("| Test Step | Status | Latency (ms) | Details |\n")
        f.write("|----------|--------|--------------|----------|\n")
        
        total_tests = len(metrics)
        passed_tests = sum(1 for m in metrics if m.get("success", False))
        failed_tests = total_tests - passed_tests
        
        for metric in metrics:
            status = "✅ Pass" if metric.get("success") else "❌ Fail"
            latency = f"{metric.get('latency_ms', 0.0):.1f}"
            test_name = metric.get("test", "unknown").replace("_", " ").title()
            details = metric.get("details", "")
            
            f.write(f"| {test_name} | {status} | {latency} | {details} |\n")
            
        f.write("\n## Summary Overview\n\n")
        f.write(f"- **Total Tests:** {total_tests}\n")
        f.write(f"- **Passed:** {passed_tests}\n")
        f.write(f"- **Failed:** {failed_tests}\n")
        f.write(f"- **Success Rate:** {(passed_tests / total_tests) * 100:.1f}%\n")
        
    print(f"Report generated successfully to {md_path}")

if __name__ == "__main__":
    generate_markdown()
