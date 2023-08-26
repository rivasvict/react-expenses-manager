interface FetchInterface {
  get: (req: Request) => Response;
  post: (req: Request) => Response;
};
