# Restaurant CI/CD Starter

A complete starter project for a restaurant web application using Node.js, Express, Docker, GitHub Actions, GHCR, Kubernetes/K3s, Kustomize, and Argo CD.

## Application features
- Restaurant landing page and sample menu
- JSON menu endpoint (`GET /api/menu`)
- Health endpoint (`GET /health`)
- Basic tests using Node's built-in test runner
- Container runs as a non-root user
- Kubernetes Deployment, Service, Ingress, ConfigMap, HPA, and resource limits
- CI workflow tests and builds on pull requests
- Main-branch workflow publishes an immutable GHCR image and updates the deployment manifest; Argo CD reconciles the cluster from Git

> This is a starter/demo application. It does not yet process real orders, payments, authentication, or persist customer data. Add those capabilities with suitable security and data protection before production.

## 1. Create the GitHub repository
1. Create a new GitHub repository named `restaurant-cicd` (or another name).
2. Upload/push these files to the repository's `main` branch.
3. In **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions** so the workflow can commit the updated image manifest.
4. In **Settings → Packages** or the package settings after the first image publish, set package visibility as desired. Public packages simplify demo pulls; private packages require a Kubernetes image pull secret.

## 2. First push from your computer
```bash
git init
git branch -M main
git add .
git commit -m "Initial restaurant CI/CD application"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/restaurant-cicd.git
git push -u origin main
```
Replace `YOUR_GITHUB_USERNAME` and use your actual repository URL.

## 3. GitHub Actions behavior
- Pull requests: install dependencies, run tests, and build the Docker image without publishing it.
- Pushes to `main`: test, build and publish `ghcr.io/<owner>/restaurant-cicd:<commit-sha>`, then update `k8s/deployment.yaml` with that immutable image tag.
- The workflow-generated manifest commit includes `[skip ci]` to avoid a second publish run.
- For production, pin third-party actions to verified full commit SHAs and protect `main` with pull-request review.

## 4. Local run and tests
Requirements: Node.js 22+ and npm.
```bash
npm install
npm test
npm start
```
Open `http://localhost:3000`. Health check: `http://localhost:3000/health`.

Build/run container:
```bash
docker build -t restaurant-cicd:local .
docker run --rm -p 3000:3000 restaurant-cicd:local
```

## 5. Configure Kubernetes / K3s
Edit:
- `k8s/ingress.yaml`: set `restaurant.example.com` to a DNS name that resolves to your K3s ingress endpoint.
- `argocd/restaurant-app.yaml`: set the correct GitHub repository URL and branch.
- `k8s/deployment.yaml`: the image will be updated by GitHub Actions after a successful main-branch run. The initial image placeholder is intentionally non-deployable until CI publishes an image.

Confirm cluster and ingress:
```bash
kubectl get nodes
kubectl get pods -A
kubectl get ingressclass
kubectl get pods -n kube-system
```
K3s usually bundles Traefik. If your cluster uses another ingress controller, change `ingressClassName`.

## 6. Argo CD bootstrap
Install Argo CD if it is not already installed. If using the Helm release from your existing lab, keep that installation and namespace. Then apply:
```bash
kubectl apply -f argocd/restaurant-app.yaml
kubectl get applications -n argocd
kubectl get pods -n restaurant
```
The Argo CD Application points to `k8s/` and uses automated sync/self-heal. The Kustomize resource list creates the namespace as part of the source. The destination namespace must exist or be creatable by the Argo CD application controller; `CreateNamespace=true` is set in sync options.

## 7. Private GHCR image
If the GHCR package is private, create a GitHub token with `read:packages` permission and configure a Kubernetes pull secret. Do not commit the token or secret YAML to Git:
```bash
kubectl create namespace restaurant
kubectl -n restaurant create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password='YOUR_READ_PACKAGES_TOKEN'
```
Then add this under `spec.template.spec` in `k8s/deployment.yaml`:
```yaml
imagePullSecrets:
  - name: ghcr-pull
```
Prefer a secrets manager or sealed/external secrets for production. If the package is public, this secret is unnecessary.

## 8. Validate / troubleshoot
```bash
kubectl kustomize k8s
kubectl apply -k k8s
kubectl rollout status deployment/restaurant-app -n restaurant
kubectl get pods,svc,ingress,hpa -n restaurant
kubectl describe deployment restaurant-app -n restaurant
kubectl logs deployment/restaurant-app -n restaurant
kubectl get events -n restaurant --sort-by=.metadata.creationTimestamp
kubectl get application restaurant-app -n argocd -o yaml
```
`kubectl apply -k k8s` is for a manual bootstrap/test. For ongoing GitOps management, let Argo CD own reconciliation and avoid competing manual changes.

For local cluster access without DNS:
```bash
kubectl -n restaurant port-forward svc/restaurant-service 8080:80
```
Then open `http://127.0.0.1:8080`.

## 9. Scaling caveat
The HPA requires metrics-server (commonly included with K3s). On a small single-node EC2 lab, two replicas and resource requests can exceed available capacity. If pods remain `Pending`, inspect `kubectl describe pod` and node capacity; adjust replicas/requests for lab use. Production availability requires multiple suitable worker nodes, not merely `replicas: 2` on one host.

## Security checklist before production
- Add TLS with cert-manager or your approved certificate process.
- Add authentication/authorization and secure order/payment integrations.
- Use managed database/storage and backups; do not rely on container filesystem persistence.
- Store credentials in a secrets manager; never commit `.env` files or tokens.
- Pin GitHub Actions to full SHAs, scan images/dependencies, and protect branches/environments.
- Set restrictive network policies and review public ingress exposure.
