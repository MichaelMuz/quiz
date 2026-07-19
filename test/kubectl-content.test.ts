import { describe, expect, it } from "vitest";
import { commandConcepts, commandExerciseId, commandExercises } from "../src/content.js";

function kubectlConcept(id: string) {
  return commandConcepts.find((candidate) => candidate.command === "kubectl" && candidate.concept === id);
}

describe("kubectl proficiency track", () => {
  it("starts with explicit API resource, context, and namespace scope", () => {
    const concept = kubectlConcept("request-scope");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/group.*resource.*namespace.*name/i);
    expect(concept!.definition.answer).toMatch(/namespaced.*cluster-scoped/i);
    expect(concept!.definition.answer).toMatch(/--context.*-n.*one command/i);
    expect(concept!.read.correctChoice).toBe("Deployment quiz in namespace quiz on context homelab");
    expect(concept!.write.correctChoice).toBe("kubectl --context homelab get service quiz -n quiz");
    expect(commandExercises.filter((item) => item.command?.command === "kubectl"
      && item.command.concept === "request-scope").map((item) => item.id).sort()).toEqual([
      commandExerciseId("kubectl", "request-scope", "definition"),
      commandExerciseId("kubectl", "request-scope", "read"),
      commandExerciseId("kubectl", "request-scope", "write"),
    ].sort());
  });

  it("uses API discovery to identify served resource types before querying instances", () => {
    const concept = kubectlConcept("api-discovery");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/api-resources.*resource.*group.*version.*namespaced/i);
    expect(concept!.definition.answer).toMatch(/api-versions.*served group\/versions/i);
    expect(concept!.definition.answer).toMatch(/get --raw \/api\/v1.*\/apis\/apps\/v1/i);
    expect(concept!.definition.answer).toMatch(/not.*schema.*instances/i);
    expect(concept!.read.correctChoice).toMatch(/namespaced.*argoproj\.io\/v1alpha1/i);
    expect(concept!.write.correctChoice).toBe("kubectl api-resources --api-group=longhorn.io -o wide");
  });

  it("separates field-schema introspection from CRD and object inspection", () => {
    const concept = kubectlConcept("schema-introspection");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/explain.*OpenAPI.*nested.*--recursive/i);
    expect(concept!.definition.answer).toMatch(/built-in.*not CRDs/i);
    expect(concept!.definition.answer).toMatch(/custom resource.*CustomResourceDefinition.*openAPIV3Schema/i);
    expect(concept!.read.correctChoice).toMatch(/restartCount.*integer.*Pod schema/i);
    expect(concept!.write.correctChoice).toBe("kubectl explain volume.spec.numberOfReplicas --api-version=longhorn.io/v1beta2");
  });

  it("chooses get, describe, and output shaping for distinct inspection jobs", () => {
    const concept = kubectlConcept("object-inspection");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/get.*list.*named object.*describe.*related.*events/i);
    expect(concept!.definition.answer).toMatch(/-o wide.*YAML.*JSON.*jsonpath.*custom-columns/i);
    expect(concept!.definition.answer).toMatch(/single-quote.*shell/i);
    expect(concept!.read.correctChoice).toBe("quiz-abc   true   0   talos-worker-05");
    expect(concept!.write.correctChoice).toBe("kubectl get deployment quiz -n quiz -o jsonpath='{.spec.template.spec.containers[*].image}'");
  });

  it("distinguishes label selectors from resource-specific field selectors", () => {
    const concept = kubectlConcept("selectors");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/-l.*labels.*--show-labels/i);
    expect(concept!.definition.answer).toMatch(/--field-selector.*server.*limited.*resource type/i);
    expect(concept!.definition.answer).toMatch(/comma.*all.*requirements/i);
    expect(concept!.read.correctChoice).toBe("quiz-a only");
    expect(concept!.write.correctChoice).toBe("kubectl get pods -n quiz -l app=quiz --field-selector=status.phase=Running");
  });

  it("does not confuse Pod phase with container readiness and restart evidence", () => {
    const concept = kubectlConcept("pod-status");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/phase.*not.*readiness/i);
    expect(concept!.definition.answer).toMatch(/containerStatuses.*ready.*restartCount.*state.*lastState/i);
    expect(concept!.definition.answer).toMatch(/ownerReferences/i);
    expect(concept!.read.correctChoice).toMatch(/Running.*not Ready.*OOMKilled.*CrashLoopBackOff/i);
    expect(concept!.write.correctChoice).toBe("kubectl describe pod quiz-abc -n quiz");
  });

  it("targets the right log source, container instance, and time window", () => {
    const concept = kubectlConcept("logs");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/Pod.*-c.*container.*--all-containers/i);
    expect(concept!.definition.answer).toMatch(/--previous.*terminated.*container instance/i);
    expect(concept!.definition.answer).toMatch(/--since.*--tail.*-f.*--prefix/i);
    expect(concept!.read.correctChoice).toMatch(/previous app container.*last 10 minutes/i);
    expect(concept!.write.correctChoice).toBe("kubectl logs pod/quiz-abc -n quiz --all-containers --prefix");
  });

  it("uses focused events as transient diagnostic evidence rather than history", () => {
    const concept = kubectlConcept("events");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/namespaced.*Event.*reason.*message.*regarding/i);
    expect(concept!.definition.answer).toMatch(/best-effort.*limited retention.*not.*audit/i);
    expect(concept!.definition.answer).toMatch(/--for.*--types.*--watch/i);
    expect(concept!.read.correctChoice).toMatch(/scheduler.*resource requests.*taints/i);
    expect(concept!.write.correctChoice).toBe("kubectl events -n quiz --for pod/quiz-abc --types=Warning");
  });

  it("traces Service selectors through EndpointSlices to ready Pod backends", () => {
    const concept = kubectlConcept("service-routing");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/Service.*selector.*Pod labels.*EndpointSlice.*actual backends/i);
    expect(concept!.definition.answer).toMatch(/port.*Service port.*targetPort.*Pod/i);
    expect(concept!.definition.answer).toMatch(/healthy Deployment.*does not guarantee.*endpoints/i);
    expect(concept!.read.correctChoice).toMatch(/selector.*app=quiz.*Pod.*app=quiz-v2.*no endpoints/i);
    expect(concept!.write.correctChoice).toBe("kubectl get endpointslices -n quiz -l kubernetes.io/service-name=quiz -o yaml");
  });

  it("reads rollout status through controller conditions and ownership", () => {
    const concept = kubectlConcept("workload-rollouts");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/Deployment.*ReplicaSet.*Pods.*ownerReferences/i);
    expect(concept!.definition.answer).toMatch(/desired.*updated.*ready.*available.*conditions/i);
    expect(concept!.definition.answer).toMatch(/rollout status.*watch.*timeout.*non-zero/i);
    expect(concept!.read.correctChoice).toMatch(/ProgressDeadlineExceeded.*stalled.*new ReplicaSet.*Pods/i);
    expect(concept!.write.correctChoice).toBe("kubectl rollout status deployment/quiz -n quiz --timeout=90s");
  });

  it("checks authorization for the exact verb, resource, subresource, and identity", () => {
    const concept = kubectlConcept("authorization");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/verb.*resource.*namespace.*name.*subresource/i);
    expect(concept!.definition.answer).toMatch(/pods\/log.*different.*pods/i);
    expect(concept!.definition.answer).toMatch(/--as.*impersonation permission/i);
    expect(concept!.read.correctChoice).toMatch(/read Pod objects.*cannot read.*logs/i);
    expect(concept!.write.correctChoice).toBe("kubectl auth can-i list pods --as=system:serviceaccount:quiz:reader -n quiz");
  });

  it("previews declarative changes with the right dry-run and diff semantics", () => {
    const concept = kubectlConcept("apply-preview");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/dry-run=client.*local.*dry-run=server.*admission.*validation.*not persist/i);
    expect(concept!.definition.answer).toMatch(/kubectl diff.*exit.*0.*no differences.*1.*differences.*greater than 1.*error/i);
    expect(concept!.definition.answer).toMatch(/GitOps.*commit.*controller/i);
    expect(concept!.read.correctChoice).toMatch(/exit 1.*differences.*not.*failure/i);
    expect(concept!.write.correctChoice).toBe("kubectl apply --dry-run=server -f rendered.yaml -o yaml");
  });

  it("treats server-side apply conflicts as field-ownership signals", () => {
    const concept = kubectlConcept("apply-ownership");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/server-side apply.*managedFields.*field manager.*conflict/i);
    expect(concept!.definition.answer).toMatch(/--force-conflicts.*takes ownership.*not.*casual/i);
    expect(concept!.definition.answer).toMatch(/client-side apply.*last-applied/i);
    expect(concept!.read.correctChoice).toMatch(/Argo CD owns.*spec.replicas.*change.*Git source/i);
    expect(concept!.write.correctChoice).toBe("kubectl apply --server-side --field-manager=quiz-release -f deployment.yaml");
  });

  it("distinguishes served API representations from a CRD storage version", () => {
    const concept = kubectlConcept("api-evolution");
    expect(concept).toBeDefined();
    expect(concept!.definition.answer).toMatch(/served.*accepts requests.*storage.*persisted.*exactly one/i);
    expect(concept!.definition.answer).toMatch(/conversion.*same underlying custom resource/i);
    expect(concept!.definition.answer).toMatch(/apiVersion.*representation.*not prove.*storage/i);
    expect(concept!.definition.answer).toMatch(/kubectl.*API server.*not.*directly.*etcd/i);
    expect(concept!.definition.answer).toMatch(/resourceVersion.*concurrency.*watch.*not.*etcd revision/i);
    expect(concept!.definition.answer).toMatch(/1\.35\+.*orderable.*same API group.*resource.*arbitrary-size/i);
    expect(concept!.definition.answer).toMatch(/pass.*unmodified.*server/i);
    expect(concept!.definition.answer).toMatch(/etcdctl.*control-plane.*forensics.*disaster recovery.*not.*normal/i);
    expect(concept!.read.correctChoice).toMatch(/v1alpha1 and v1beta1.*served.*v1beta1.*storage/i);
    expect(concept!.write.correctChoice).toContain(".spec.versions[*]");
  });

  it("ships a complete, uniquely identified kubectl cohort", () => {
    const concepts = commandConcepts.filter((candidate) => candidate.command === "kubectl");
    expect(concepts).toHaveLength(14);
    expect(new Set(concepts.map((concept) => concept.concept)).size).toBe(14);
    expect(commandExercises.filter((item) => item.command?.command === "kubectl")).toHaveLength(42);
    expect(concepts.every((concept) => concept.references.length > 0)).toBe(true);
    expect(concepts.every((concept) => concept.platform.includes("kubectl"))).toBe(true);
  });
});
